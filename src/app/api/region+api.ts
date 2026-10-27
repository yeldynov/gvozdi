// GET /api/region → { country } from EAS Hosting's IP geolocation header (null in dev or when unknown).
export function GET(request: Request) {
  return Response.json({ country: request.headers.get('eas-ip-country') });
}
