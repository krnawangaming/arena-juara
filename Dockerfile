FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

# Pasang dependensi dulu (memanfaatkan cache Docker)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Salin sisa berkas aplikasi
COPY . .

ENV PORT=3000
ENV DATA_DIR=/data
EXPOSE 3000
VOLUME ["/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:3000/healthz || exit 1

CMD ["node", "server.js"]
