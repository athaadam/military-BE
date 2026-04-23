# Pake image Node versi LTS
FROM node:20-alpine

# Set working directory di dalam container
WORKDIR /usr/src/app

# Copy package files dulu buat optimasi cache
COPY package*.json ./

# Install dependensi
RUN npm install

# Copy semua source code project
COPY . .

# Expose port aplikasi (sesuai app.js lo)
EXPOSE 3000

# Command buat jalanin app
CMD ["node", "server.js"]