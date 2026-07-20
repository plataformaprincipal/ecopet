# Processamento de Arquivos (prep)

## Suportado agora

- Upload Cloudinary (`purpose: ai_attachment`)
- Validação MIME/tamanho/extensão
- Metadados em `AIFile`
- Extração de texto **apenas** TXT/CSV
- Virus scan: status `skipped` (preparado)

## Não implementado

OCR, visão computacional, parsing completo PDF/DOCX/XLSX.

## API de uso

`uploadAiAttachment({ userId, fileName, mimeType, buffer, conversationId? })`
