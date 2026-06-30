export class MissingRuntimeConfigError extends Error {
  constructor() {
    super("Runtime environment is not configured. Call configure_environment first.");
    this.name = "MissingRuntimeConfigError";
  }
}

export type RuntimeConfig = {
  environment: string;
  apiBaseUrl: string;
  apiToken?: string;
};

export type RuntimeEnvironmentStatus =
  {
    configured: boolean;
    environment?: string;
    api_base_url?: string;
    has_api_token?: boolean;
  };

export class RuntimeState {
  private config: RuntimeConfig | undefined;

  configure(input: {
    environment: string;
    api_base_url: string;
    api_token?: string;
  }): {
    status: "configured";
    configured: true;
    environment: string;
    api_base_url: string;
    has_api_token: boolean;
  } {
    const environment = input.environment.trim();
    const apiBaseUrl = input.api_base_url.trim().replace(/\/+$/, "");

    if (!environment) {
      throw new Error("environment is required");
    }
    if (!apiBaseUrl) {
      throw new Error("api_base_url is required");
    }

    this.config = {
      environment,
      apiBaseUrl,
      apiToken: input.api_token
    };

    return {
      status: "configured",
      ...this.statusConfigured()
    };
  }

  status(): RuntimeEnvironmentStatus {
    if (this.config === undefined) {
      return { configured: false };
    }
    return this.statusConfigured();
  }

  clear(): { status: "cleared"; was_configured: boolean; configured: false } {
    const wasConfigured = this.config !== undefined;
    this.config = undefined;
    return {
      status: "cleared",
      was_configured: wasConfigured,
      configured: false
    };
  }

  requireEnvironment(): RuntimeConfig {
    if (this.config === undefined) {
      throw new MissingRuntimeConfigError();
    }
    return this.config;
  }

  private statusConfigured(): {
    configured: true;
    environment: string;
    api_base_url: string;
    has_api_token: boolean;
  } {
    if (this.config === undefined) {
      throw new MissingRuntimeConfigError();
    }

    return {
      configured: true,
      environment: this.config.environment,
      api_base_url: this.config.apiBaseUrl,
      has_api_token: this.config.apiToken !== undefined
    };
  }
}
