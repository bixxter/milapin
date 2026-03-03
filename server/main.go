package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"errors"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ─────────────────────────────────────────────
// GLOBALS
// ─────────────────────────────────────────────

var (
	dbPool   *pgxpool.Pool
	s3Client *s3.Client
	r2Bucket string
)

// ─────────────────────────────────────────────
// STRUCTS
// ─────────────────────────────────────────────

type GrabRequest struct {
	PinURL string `json:"pin_url"`
}

type GrabResponse struct {
	Success  bool   `json:"success"`
	MediaURL string `json:"media_url"`
	FilePath string `json:"file_path,omitempty"`
	R2Key    string `json:"r2_key,omitempty"`
	Error    string `json:"error,omitempty"`
}

type AuthenticatedUser struct {
	ID    string
	Email string
}

// ─────────────────────────────────────────────
// API KEY AUTHENTICATION
// ─────────────────────────────────────────────

func authenticateRequest(r *http.Request) (*AuthenticatedUser, error) {
	apiKey := r.Header.Get("X-API-Key")
	if apiKey == "" {
		return nil, fmt.Errorf("missing X-API-Key header")
	}

	var user AuthenticatedUser
	err := dbPool.QueryRow(context.Background(),
		`SELECT id, email FROM users WHERE api_key = $1`, apiKey,
	).Scan(&user.ID, &user.Email)
	if err != nil {
		return nil, fmt.Errorf("invalid API key")
	}

	return &user, nil
}

// ─────────────────────────────────────────────
// R2 UPLOAD
// ─────────────────────────────────────────────

func uploadToR2(ctx context.Context, filePath, userID, filename, contentType string) (string, error) {
	r2Key := fmt.Sprintf("%s/%s", userID, filename)

	file, err := os.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to open file for upload: %w", err)
	}
	defer file.Close()

	_, err = s3Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(r2Bucket),
		Key:         aws.String(r2Key),
		Body:        file,
		ContentType: aws.String(contentType),
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload to R2: %w", err)
	}

	return r2Key, nil
}

// ─────────────────────────────────────────────
// DB: CHECK DUPLICATE
// ─────────────────────────────────────────────

type existingFile struct {
	R2Key    string
	MediaURL string
}

func findExisting(ctx context.Context, userID, sourceURL string) (*existingFile, error) {
	var f existingFile
	err := dbPool.QueryRow(ctx,
		`SELECT r2_key, source_url FROM media_files WHERE user_id = $1 AND source_url = $2 LIMIT 1`,
		userID, sourceURL,
	).Scan(&f.R2Key, &f.MediaURL)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to check duplicate: %w", err)
	}
	return &f, nil
}

// ─────────────────────────────────────────────
// DB: RECORD MEDIA FILE
// ─────────────────────────────────────────────

func recordMediaFile(ctx context.Context, userID, filename, r2Key, contentType, mediaType string, size int64, sourceURL string) error {
	tx, err := dbPool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx,
		`INSERT INTO media_files (user_id, filename, r2_key, content_type, size, type, source_url)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		userID, filename, r2Key, contentType, size, mediaType, sourceURL,
	)
	if err != nil {
		return fmt.Errorf("failed to insert media file: %w", err)
	}

	_, err = tx.Exec(ctx,
		`UPDATE users SET storage_used = storage_used + $1 WHERE id = $2`,
		size, userID,
	)
	if err != nil {
		return fmt.Errorf("failed to update storage_used: %w", err)
	}

	return tx.Commit(ctx)
}

// ─────────────────────────────────────────────
// CORS MIDDLEWARE
// ─────────────────────────────────────────────

func withCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-API-Key")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

// ─────────────────────────────────────────────
// PINTEREST SCRAPER
// ─────────────────────────────────────────────

func fetchPinMediaURL(pinURL string) (string, error) {
	client := &http.Client{Timeout: 15 * time.Second}

	req, err := http.NewRequest("GET", pinURL, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
	req.Header.Set("Accept-Language", "en-US,en;q=0.5")

	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to fetch pin page: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read body: %w", err)
	}

	html := string(body)

	// Try to find direct .mp4 video first
	for _, key := range []string{"V_720P", "V_480P", "V_EXP7"} {
		re := regexp.MustCompile(`"` + key + `"\s*:\s*\{[^}]*"url"\s*:\s*"(https://v[^"]*\.pinimg\.com/videos/[^"]+\.mp4[^"]*)"`)
		if matches := re.FindStringSubmatch(html); len(matches) > 1 {
			return matches[1], nil
		}
	}

	// Any direct .mp4 video URL
	videoMp4Regex := regexp.MustCompile(`"url"\s*:\s*"(https://v[^"]*\.pinimg\.com/videos/[^"]+\.mp4[^"]*)"`)
	if matches := videoMp4Regex.FindStringSubmatch(html); len(matches) > 1 {
		return matches[1], nil
	}

	// HLS playlist as last resort for video
	hlsRegex := regexp.MustCompile(`"url"\s*:\s*"(https://v[^"]*\.pinimg\.com/videos/[^"]+\.m3u8[^"]*)"`)
	if matches := hlsRegex.FindStringSubmatch(html); len(matches) > 1 {
		return matches[1], nil
	}

	// Fallback: high-res image
	imageRegex := regexp.MustCompile(`"url"\s*:\s*"(https://i\.pinimg\.com/originals/[^"]+)"`)
	if matches := imageRegex.FindStringSubmatch(html); len(matches) > 1 {
		return matches[1], nil
	}

	// Fallback: any pinimg URL
	anyImageRegex := regexp.MustCompile(`"(https://i\.pinimg\.com/[^"]+\.(jpg|jpeg|png|gif|webp))"`)
	if matches := anyImageRegex.FindStringSubmatch(html); len(matches) > 1 {
		return matches[1], nil
	}

	return "", fmt.Errorf("could not find media URL in pin page")
}

// ─────────────────────────────────────────────
// HLS DOWNLOADER
// ─────────────────────────────────────────────

func downloadHLS(hlsURL string) (string, string, error) {
	filename := fmt.Sprintf("pin_%d.mp4", time.Now().UnixMilli())
	tmpPath := filepath.Join(os.TempDir(), filename)

	cmd := exec.Command("ffmpeg",
		"-i", hlsURL,
		"-c", "copy",
		"-y",
		tmpPath,
	)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", "", fmt.Errorf("ffmpeg failed: %w\n%s", err, string(output))
	}

	return tmpPath, filename, nil
}

// ─────────────────────────────────────────────
// DOWNLOADER — downloads to temp directory
// ─────────────────────────────────────────────

func downloadMedia(mediaURL string) (tmpPath, filename, contentType, mediaType string, err error) {
	// HLS stream — use ffmpeg
	if strings.Contains(mediaURL, ".m3u8") {
		tmpPath, filename, err = downloadHLS(mediaURL)
		if err != nil {
			return "", "", "", "", err
		}
		return tmpPath, filename, "video/mp4", "video", nil
	}

	client := &http.Client{Timeout: 30 * time.Second}

	req, err := http.NewRequest("GET", mediaURL, nil)
	if err != nil {
		return "", "", "", "", err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible)")
	req.Header.Set("Referer", "https://www.pinterest.com/")

	resp, err := client.Do(req)
	if err != nil {
		return "", "", "", "", fmt.Errorf("failed to download media: %w", err)
	}
	defer resp.Body.Close()

	// Determine extension and content type
	ext := ""
	ct := resp.Header.Get("Content-Type")
	mt := "image"
	switch {
	case strings.Contains(ct, "video/mp4"):
		ext, ct, mt = ".mp4", "video/mp4", "video"
	case strings.Contains(ct, "video/webm"):
		ext, ct, mt = ".webm", "video/webm", "video"
	case strings.Contains(ct, "video/"):
		ext, ct, mt = ".mp4", "video/mp4", "video"
	case strings.Contains(ct, "image/png"):
		ext, ct = ".png", "image/png"
	case strings.Contains(ct, "image/gif"):
		ext, ct, mt = ".gif", "image/gif", "gif"
	case strings.Contains(ct, "image/webp"):
		ext, ct = ".webp", "image/webp"
	default:
		ext = filepath.Ext(strings.Split(mediaURL, "?")[0])
		if ext == "" {
			ext = ".jpg"
		}
		ct = "image/jpeg"
	}

	fname := fmt.Sprintf("pin_%d%s", time.Now().UnixMilli(), ext)
	tmp := filepath.Join(os.TempDir(), fname)

	file, err := os.Create(tmp)
	if err != nil {
		return "", "", "", "", fmt.Errorf("failed to create temp file: %w", err)
	}
	defer file.Close()

	_, err = io.Copy(file, resp.Body)
	if err != nil {
		return "", "", "", "", fmt.Errorf("failed to save file: %w", err)
	}

	return tmp, fname, ct, mt, nil
}

// ─────────────────────────────────────────────
// HTTP HANDLER
// ─────────────────────────────────────────────

func grabHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Authenticate
	user, err := authenticateRequest(r)
	if err != nil {
		sendJSON(w, http.StatusUnauthorized, GrabResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	// Parse JSON body
	var req GrabRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendJSON(w, http.StatusBadRequest, GrabResponse{
			Success: false,
			Error:   "Invalid JSON: " + err.Error(),
		})
		return
	}

	if req.PinURL == "" {
		sendJSON(w, http.StatusBadRequest, GrabResponse{
			Success: false,
			Error:   "pin_url is required",
		})
		return
	}

	log.Printf("Grabbing pin for user %s: %s", user.Email, req.PinURL)

	// Step 1: Get media URL from Pinterest page
	mediaURL, err := fetchPinMediaURL(req.PinURL)
	if err != nil {
		log.Printf("Failed to get media URL: %v", err)
		sendJSON(w, http.StatusInternalServerError, GrabResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	log.Printf("Found media URL: %s", mediaURL)

	// Check for duplicate — return existing file instead of re-downloading
	existing, err := findExisting(r.Context(), user.ID, mediaURL)
	if err != nil {
		log.Printf("Failed to check duplicate: %v", err)
		sendJSON(w, http.StatusInternalServerError, GrabResponse{
			Success: false,
			Error:   "Failed to check for duplicates",
		})
		return
	}
	if existing != nil {
		log.Printf("Duplicate skipped for user %s: %s", user.Email, mediaURL)
		sendJSON(w, http.StatusOK, GrabResponse{
			Success:  true,
			MediaURL: mediaURL,
			R2Key:    existing.R2Key,
		})
		return
	}

	// Step 2: Download to temp file
	tmpPath, filename, contentType, mediaType, err := downloadMedia(mediaURL)
	if err != nil {
		log.Printf("Failed to download: %v", err)
		sendJSON(w, http.StatusInternalServerError, GrabResponse{
			Success:  false,
			MediaURL: mediaURL,
			Error:    err.Error(),
		})
		return
	}
	defer os.Remove(tmpPath) // Clean up temp file

	// Get file size
	stat, err := os.Stat(tmpPath)
	if err != nil {
		log.Printf("Failed to stat file: %v", err)
		sendJSON(w, http.StatusInternalServerError, GrabResponse{
			Success: false,
			Error:   "Failed to read downloaded file",
		})
		return
	}

	// Step 3: Upload to R2
	ctx := r.Context()
	r2Key, err := uploadToR2(ctx, tmpPath, user.ID, filename, contentType)
	if err != nil {
		log.Printf("Failed to upload to R2: %v", err)
		sendJSON(w, http.StatusInternalServerError, GrabResponse{
			Success:  false,
			MediaURL: mediaURL,
			Error:    err.Error(),
		})
		return
	}

	// Step 4: Record in database
	err = recordMediaFile(ctx, user.ID, filename, r2Key, contentType, mediaType, stat.Size(), mediaURL)
	if err != nil {
		log.Printf("Failed to record media file: %v", err)
		sendJSON(w, http.StatusInternalServerError, GrabResponse{
			Success:  false,
			MediaURL: mediaURL,
			Error:    err.Error(),
		})
		return
	}

	log.Printf("Saved to R2: %s (%.1f KB)", r2Key, float64(stat.Size())/1024)

	sendJSON(w, http.StatusOK, GrabResponse{
		Success:  true,
		MediaURL: mediaURL,
		R2Key:    r2Key,
	})
}

// sendJSON — helper to send JSON responses
func sendJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func main() {
	ctx := context.Background()

	// ── Init Database Pool ──
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}
	var err error
	dbPool, err = pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer dbPool.Close()
	log.Println("Connected to Postgres")

	// ── Init S3/R2 Client ──
	r2AccountID := os.Getenv("R2_ACCOUNT_ID")
	r2AccessKey := os.Getenv("R2_ACCESS_KEY_ID")
	r2SecretKey := os.Getenv("R2_SECRET_ACCESS_KEY")
	r2Bucket = os.Getenv("R2_BUCKET_NAME")

	if r2AccountID == "" || r2AccessKey == "" || r2SecretKey == "" || r2Bucket == "" {
		log.Fatal("R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME are required")
	}

	r2Endpoint := fmt.Sprintf("https://%s.r2.cloudflarestorage.com", r2AccountID)

	s3Client = s3.New(s3.Options{
		BaseEndpoint: aws.String(r2Endpoint),
		Region:       "auto",
		Credentials:  aws.NewCredentialsCache(credentials.NewStaticCredentialsProvider(r2AccessKey, r2SecretKey, "")),
	})
	log.Println("Connected to R2")

	// Register routes
	http.HandleFunc("/grab", withCORS(grabHandler))

	// Health check endpoint
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"status":"ok"}`))
	})

	port := ":8080"
	log.Printf("Pinterest Grabber server running on http://localhost%s", port)
	log.Fatal(http.ListenAndServe(port, nil))
}
