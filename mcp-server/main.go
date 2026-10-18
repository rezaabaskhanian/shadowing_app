// lingoflow-mcp یک سرور MCP (stdio) است که API ادمینِ LingoFlow را به صورت
// ابزار در اختیار Claude می‌گذارد تا ساخت محتوا (صحنه، پادکست، موضوع صحبت،
// کلیپ، اصطلاح، منبع) و گزارش‌گیری خودکار شود. همه‌چیز پیش‌نویس ساخته می‌شود؛
// انتشار و حذف فقط از پنل ادمین.
//
// تنظیمات با متغیر محیطی:
//
//	LINGOFLOW_API_URL         مثلاً https://api.lingoflow.ir
//	LINGOFLOW_ADMIN_PHONE     شماره‌ی حساب ادمین
//	LINGOFLOW_ADMIN_PASSWORD  رمز همان حساب
package main

import (
	"context"
	"log"
	"os"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

func main() {
	// stdout مال پروتکل MCP است؛ لاگ‌ها فقط به stderr.
	log.SetOutput(os.Stderr)

	baseURL := os.Getenv("LINGOFLOW_API_URL")
	phone := os.Getenv("LINGOFLOW_ADMIN_PHONE")
	password := os.Getenv("LINGOFLOW_ADMIN_PASSWORD")
	if baseURL == "" || phone == "" || password == "" {
		log.Fatal("LINGOFLOW_API_URL, LINGOFLOW_ADMIN_PHONE and LINGOFLOW_ADMIN_PASSWORD must be set")
	}

	server := mcp.NewServer(&mcp.Implementation{Name: "lingoflow", Version: "0.1.0"}, &mcp.ServerOptions{
		Instructions: "LingoFlow admin tools. Everything you create is a draft/inactive; the admin publishes in the panel. " +
			"There are no delete tools. Typical flow: get_resource → generate_scene / generate_podcast_script → " +
			"create_*_draft → generate_audio / generate_podcast_audio → content_health to verify.",
	})
	registerTools(server, newClient(baseURL, phone, password))

	if err := server.Run(context.Background(), &mcp.StdioTransport{}); err != nil {
		log.Fatal(err)
	}
}
