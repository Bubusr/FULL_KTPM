import json
import os

convo_ids = {
    "Cách triển khai môngdb trên K8S thay vì docker": "81ae2503-a15b-4e58-9331-68bb4ac112c8",
    "Deploying MongoDB Web on Kubernetes": "4be02cc5-f1af-4b27-b350-9bace7d412d8",
    "Installing Prometheus On Kubernetes": "8c05a62a-ccac-4706-b3d1-f53d456d38c5"
}

output_path = "/Users/apple/.gemini/antigravity-ide/brain/f835d14e-6eeb-46a9-acaa-1c069239a30e/K8s_Conversations_Summary.md"
final_content = ""

for title, convo_id in convo_ids.items():
    transcript_path = f"/Users/apple/.gemini/antigravity-ide/brain/{convo_id}/.system_generated/logs/transcript.jsonl"
    
    summary_table = f"# Tổng Hợp Phiên Chat: {title}\n\n| Thời gian | Câu hỏi của bạn | Tóm tắt |\n| :--- | :--- | :--- |\n"
    full_text = "\n\n## CHI TIẾT ĐẦY ĐỦ CÂU TRẢ LỜI\n\n"
    
    if not os.path.exists(transcript_path):
        final_content += f"# Tổng Hợp Phiên Chat: {title}\n\n**Lỗi:** Không tìm thấy file lịch sử cho phiên chat này. Thư mục đã bị xóa khỏi hệ thống.\n\n<hr>\n\n"
        continue
        
    try:
        with open(transcript_path, "r") as f:
            lines = f.readlines()
            
        current_q = ""
        current_date = ""
        
        for line in lines:
            try:
                data = json.loads(line)
            except:
                continue
            
            if data.get("type") == "USER_INPUT":
                content = data.get("content", "")
                if "<USER_REQUEST>" in content:
                    req = content.split("<USER_REQUEST>")[1].split("</USER_REQUEST>")[0].strip()
                else:
                    req = content.strip()
                current_date = data.get("created_at", "")
                current_q = req.replace("\n", " ")
                if len(current_q) > 60:
                    current_q_short = current_q[:60] + "..."
                else:
                    current_q_short = current_q
                    
                summary_table += f"| {current_date} | {current_q_short} | ... |\n"
                full_text += f"### 🧑‍💻 Câu hỏi ngày: {current_date}\n**Nội dung:** {req}\n\n"
                
            elif data.get("type") == "PLANNER_RESPONSE":
                content = data.get("content", "")
                
                # Check for files
                files_created = []
                if "tool_calls" in data:
                    for tc in data["tool_calls"]:
                        if tc.get("name") in ["write_to_file", "default_api:write_to_file", "replace_file_content", "default_api:replace_file_content"]:
                            args = tc.get("args", {})
                            target_file = args.get("TargetFile", "")
                            if target_file:
                                # REMOVE EXTRA QUOTES that broke the Markdown link!
                                target_file = target_file.replace("\"", "").replace("'", "")
                                basename = os.path.basename(target_file)
                                files_created.append(f"[{basename}](file://{target_file})")
                
                if content and str(content).strip() != "null" and not str(content).startswith("The following is"):
                    full_text += f"### 🤖 AI Trả Lời:\n{content}\n"
                    if files_created:
                        full_text += "\n**📎 Output Files tạo ra / chỉnh sửa:**\n"
                        for fc in files_created:
                            full_text += f"- {fc}\n"
                    full_text += "\n---\n\n"
                elif files_created:
                    full_text += f"### 🤖 AI (Thực thi tự động):\n"
                    full_text += "\n**📎 Output Files tạo ra / chỉnh sửa:**\n"
                    for fc in files_created:
                        full_text += f"- {fc}\n"
                    full_text += "\n---\n\n"
                    
        final_content += summary_table + full_text + "\n\n<hr>\n\n"
        
    except Exception as e:
        final_content += f"# Tổng Hợp Phiên Chat: {title}\n\n**Lỗi:** Có lỗi khi đọc file ({str(e)}).\n\n<hr>\n\n"

with open(output_path, "w") as f:
    f.write(final_content)
print("Done")
