## How to start

1. Rename `.env.example` to `.env`
2. Run `docker-compose up setup`
3. Run `docker-compose up`
4. Send post request to `localhost:3000/request` with body:

```json
{
  "a": 5,
  "b": 7
}
```

Еnd response will be a \* b
