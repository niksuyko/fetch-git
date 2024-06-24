# Fetch Receipt Processor API

## Clone the repo:

```sh
git clone https://github.com/niksuyko/fetch-git
cd fetch-git
```

## Build Docker image:

```sh
docker build -t receipt-processor-api .
```

## Run Docker container:

```sh
docker run -p 3000:3000 receipt-processor-api
```

## Ensure app is running:

Navigate to http://localhost:3000 to ensure the API is working.

Use Postman to simulate POST/GET requests to the server!
