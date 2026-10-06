package ttsservice

import (
	"bytes"
	"context"
	"encoding/binary"
	"fmt"
	"os/exec"
	"time"
)

// isWAV بررسی می‌کند داده هدر RIFF/WAVE دارد یا نه.
func isWAV(b []byte) bool {
	return len(b) >= 12 && string(b[0:4]) == "RIFF" && string(b[8:12]) == "WAVE"
}

// pcmToWAV یک هدر WAV استاندارد (16bit، mono) به PCM خام اضافه می‌کند.
func pcmToWAV(pcm []byte, sampleRate int) []byte {
	const (
		channels      = 1
		bitsPerSample = 16
	)
	byteRate := sampleRate * channels * bitsPerSample / 8
	blockAlign := channels * bitsPerSample / 8

	var buf bytes.Buffer
	buf.Grow(44 + len(pcm))
	buf.WriteString("RIFF")
	_ = binary.Write(&buf, binary.LittleEndian, uint32(36+len(pcm)))
	buf.WriteString("WAVE")
	buf.WriteString("fmt ")
	_ = binary.Write(&buf, binary.LittleEndian, uint32(16))
	_ = binary.Write(&buf, binary.LittleEndian, uint16(1)) // PCM
	_ = binary.Write(&buf, binary.LittleEndian, uint16(channels))
	_ = binary.Write(&buf, binary.LittleEndian, uint32(sampleRate))
	_ = binary.Write(&buf, binary.LittleEndian, uint32(byteRate))
	_ = binary.Write(&buf, binary.LittleEndian, uint16(blockAlign))
	_ = binary.Write(&buf, binary.LittleEndian, uint16(bitsPerSample))
	buf.WriteString("data")
	_ = binary.Write(&buf, binary.LittleEndian, uint32(len(pcm)))
	buf.Write(pcm)
	return buf.Bytes()
}

// wavToMP3 با ffmpeg (که در ایمیج Docker نصب است) WAV را به mp3 تبدیل می‌کند
// تا حجم فایل برای اپ موبایل حدود ۱۰ برابر کمتر شود.
//
// بیت‌ریت باید ثابت (CBR) باشد، نه متغیر (-q:a): خروجی به pipe می‌رود و ffmpeg
// نمی‌تواند برگردد و هدر Xing (طول واقعی فایل VBR) را بنویسد. بدون آن هدر،
// پلیر اندروید (ExoPlayer) طول را از بیت‌ریتِ فریم اول — که برای سکوتِ ابتدای
// صدا فقط ۸kbps است — حدس می‌زند و یک جمله‌ی ۳ ثانیه‌ای را ۲۶ ثانیه می‌بیند؛
// اپ هم تا پایانِ آن ۲۶ ثانیه منتظر می‌ماند. با CBR طول همیشه دقیق است.
func wavToMP3(ctx context.Context, wav []byte) ([]byte, error) {
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, "ffmpeg",
		"-hide_banner", "-loglevel", "error",
		"-f", "wav", "-i", "pipe:0",
		"-codec:a", "libmp3lame", "-b:a", "64k",
		"-f", "mp3", "pipe:1",
	)
	cmd.Stdin = bytes.NewReader(wav)
	var out, stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("ffmpeg: %w: %s", err, stderr.String())
	}
	if out.Len() == 0 {
		return nil, fmt.Errorf("ffmpeg produced empty output")
	}
	return out.Bytes(), nil
}
