const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/upload-task', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Chưa có file nào được tải lên!' });
        }

        const workbook = xlsx.readFile(req.file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Phân tích dữ liệu sau và trả về duy nhất định dạng JSON chuẩn (không kèm markdown khác) gồm các trường: taskName, assignee, deadline, priority: ${JSON.stringify(data)}`;

        const result = await model.generateContent(prompt);
        let responseText = result.response.text();
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const tasks = JSON.parse(responseText);

        res.json({ success: true, tasks });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend đang chạy tại cổng ${PORT}`));