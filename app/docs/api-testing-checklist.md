# API Testing Checklist

`[MOCKUP PURPOSE ONLY - NOT REAL DATA]`

## Smoke Endpoints

- `GET /api/health` returns `200` and `status: healthy`
- `GET /api/docs` opens Swagger UI
- `POST /api/auth/register` creates a mock user
- `POST /api/auth/login` returns a signed access token
- `GET /api/auth/me` returns current token payload
- `POST /api/auth/refresh` rotates access token
- `POST /api/auth/logout` revokes active token
- `POST /api/appointments` requires bearer token and creates a record
- `GET /api/appointments` requires bearer token and lists records

## Error Contract Validation

All API errors should follow:

- `statusCode`
- `error`
- `message`
- `path`
- `timestamp`
- `tag`

## Suggested QA Sequence

1. Register user.
2. Login same user.
3. Call `/api/auth/me` with bearer token.
4. Refresh token and confirm old token returns `401`.
5. Create appointment with refreshed token.
6. Query list endpoint with refreshed token.
7. Logout and confirm token is rejected (`401`).
8. Force validation error (bad email) and confirm error contract.
