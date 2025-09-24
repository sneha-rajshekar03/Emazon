import productsData from "./products.json";

export async function GET() {
  return Response.json(productsData);
}
