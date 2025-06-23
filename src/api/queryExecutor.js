export async function fetchQuery(query) {
  const response = await fetch("http://192.168.2.3:8081/api/crud/select", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao executar query: ${errorText}`);
  }

  return response.json();
}
