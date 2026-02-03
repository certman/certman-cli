import {
  CertmanAuthenticationError,
  CertmanPermissionError,
  CertmanNotFoundError,
  CertmanValidationError,
  CertmanError,
} from "@certman/sdk";

export function handleError(error: unknown): never {
  if (error instanceof CertmanAuthenticationError) {
    console.error(
      "Error: Invalid API key. Run 'certman login' to authenticate."
    );
    process.exit(1);
  }

  if (error instanceof CertmanPermissionError) {
    console.error(`Error: Permission denied: ${error.message}`);
    process.exit(1);
  }

  if (error instanceof CertmanNotFoundError) {
    console.error(`Error: Not found: ${error.message}`);
    process.exit(1);
  }

  if (error instanceof CertmanValidationError) {
    console.error(`Error: Validation error: ${error.message}`);
    process.exit(1);
  }

  if (error instanceof CertmanError) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }

  if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }

  console.error("An unexpected error occurred");
  process.exit(1);
}

export function requireApiKey(apiKey: string | undefined): asserts apiKey is string {
  if (!apiKey) {
    console.error(
      "Error: No API key configured. Run 'certman login' or set CERTMAN_API_KEY."
    );
    process.exit(1);
  }
}
