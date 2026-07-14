# Cloudinary (uploads)

## Variáveis
```
UPLOAD_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
UPLOAD_DEV_FALLBACK=1
```

## Sem chave
- Dev: fallback local se `UPLOAD_DEV_FALLBACK=1`
- Produção: bloquear upload com mensagem clara (não filesystem efêmero)

## Ativação
1. Conta Cloudinary
2. Preencher variáveis
3. Smoke admin
4. Testar upload de produto/avatar
