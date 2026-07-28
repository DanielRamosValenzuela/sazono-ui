export function submitRedirectPaymentForm(
  redirectUrl: string,
  method: "POST",
  fields: Record<string, string>
): void {
  const form = document.createElement("form");
  form.method = method;
  form.action = redirectUrl;
  form.style.display = "none";

  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}
