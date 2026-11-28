FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
COPY public ./public
RUN npm run build
ENV PORT=7860
EXPOSE 7860
CMD ["npm", "start"]
