import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  CertmanAuthenticationError,
  CertmanPermissionError,
  CertmanNotFoundError,
  CertmanValidationError,
  CertmanError,
} from "@certman/sdk";
import { handleError, requireApiKey } from "../../src/errors.js";

describe("errors", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    processExitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe("handleError", () => {
    it("handles CertmanAuthenticationError", () => {
      const error = new CertmanAuthenticationError("Invalid key");

      handleError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error: Invalid API key. Run 'certman login' to authenticate."
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("handles CertmanPermissionError", () => {
      const error = new CertmanPermissionError("Access denied");

      handleError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error: Permission denied: Access denied"
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("handles CertmanNotFoundError", () => {
      const error = new CertmanNotFoundError("Certificate not found");

      handleError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error: Not found: Certificate not found"
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("handles CertmanValidationError", () => {
      const error = new CertmanValidationError("Invalid common name");

      handleError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error: Validation error: Invalid common name"
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("handles generic CertmanError", () => {
      const error = new CertmanError("Something went wrong", 500);

      handleError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error: Something went wrong"
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("handles standard Error", () => {
      const error = new Error("Standard error");

      handleError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Standard error");
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("handles unknown error types", () => {
      handleError("string error");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "An unexpected error occurred"
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe("requireApiKey", () => {
    it("does not throw when API key is provided", () => {
      expect(() => requireApiKey("valid-key")).not.toThrow();
    });

    it("exits when API key is undefined", () => {
      requireApiKey(undefined);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error: No API key configured. Run 'certman login' or set CERTMAN_API_KEY."
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("exits when API key is empty string", () => {
      // Empty string is falsy, so it should trigger the error
      requireApiKey("");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error: No API key configured. Run 'certman login' or set CERTMAN_API_KEY."
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});
