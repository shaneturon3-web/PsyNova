/** Placeholder for REST/OpenAPI benchmarking — extend with OpenAPI fetch + latency. */
export async function benchmarkApiStub(name: string): Promise<{ name: string; note: string }> {
  return { name, note: 'api_adapter: implement OpenAPI / health probes in v1.1' };
}
