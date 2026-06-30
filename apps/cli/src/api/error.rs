use reqwest::StatusCode;
use serde::Deserialize;
use std::fmt;

#[derive(Debug, Clone, Deserialize)]
struct ApiErrorEnvelope {
    error: Option<ApiErrorBody>,
    request_id: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
struct ApiErrorBody {
    code: Option<String>,
    message: Option<String>,
    details: Option<String>,
}

#[derive(Debug, Clone)]
pub struct ApiError {
    pub status: StatusCode,
    pub code: String,
    pub message: String,
    pub details: Option<String>,
    pub request_id: Option<String>,
    pub hint: String,
}

impl ApiError {
    pub fn from_response(status: StatusCode, body: &str) -> Self {
        let envelope: ApiErrorEnvelope = serde_json::from_str(body).unwrap_or(ApiErrorEnvelope {
            error: None,
            request_id: None,
        });

        let error_body = envelope.error.unwrap_or(ApiErrorBody {
            code: None,
            message: None,
            details: None,
        });

        let code = error_body
            .code
            .unwrap_or_else(|| status_code_to_code(status).to_string());
        let message = error_body
            .message
            .unwrap_or_else(|| default_message(status));
        let request_id = envelope.request_id;
        let hint = hint_for_status(status, &code);

        Self {
            status,
            code,
            message,
            details: error_body.details,
            request_id,
            hint,
        }
    }

    pub fn is_unauthorized(&self) -> bool {
        self.status == StatusCode::UNAUTHORIZED || self.code == "unauthorized"
    }

    pub fn exit_code(&self) -> i32 {
        match self.status.as_u16() {
            401 => 2,
            403 => 3,
            404 => 4,
            429 => 5,
            400..=499 => 1,
            _ => 1,
        }
    }
}

impl fmt::Display for ApiError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.message)?;
        if let Some(details) = &self.details {
            if !details.is_empty() && details != &self.message {
                write!(f, " ({details})")?;
            }
        }
        Ok(())
    }
}

impl std::error::Error for ApiError {}

fn status_code_to_code(status: StatusCode) -> &'static str {
    match status {
        StatusCode::UNAUTHORIZED => "unauthorized",
        StatusCode::FORBIDDEN => "forbidden",
        StatusCode::NOT_FOUND => "not_found",
        StatusCode::TOO_MANY_REQUESTS => "rate_limited",
        StatusCode::BAD_REQUEST => "bad_request",
        _ if status.is_server_error() => "server_error",
        _ => "api_error",
    }
}

fn default_message(status: StatusCode) -> String {
    match status {
        StatusCode::UNAUTHORIZED => "Invalid or expired API key".to_string(),
        StatusCode::FORBIDDEN => "You don't have permission for this action".to_string(),
        StatusCode::NOT_FOUND => "Resource not found".to_string(),
        StatusCode::TOO_MANY_REQUESTS => "Rate limit exceeded".to_string(),
        _ if status.is_server_error() => "The lomi. API is temporarily unavailable".to_string(),
        _ => format!("API request failed ({status})"),
    }
}

fn hint_for_status(status: StatusCode, code: &str) -> String {
    if status == StatusCode::UNAUTHORIZED || code == "unauthorized" {
        return "Run `lomi login` to refresh your CLI token.".to_string();
    }
    if status == StatusCode::FORBIDDEN {
        return "Check your account permissions in the lomi. dashboard.".to_string();
    }
    if status == StatusCode::NOT_FOUND {
        return "Verify the resource ID and try again.".to_string();
    }
    if status == StatusCode::TOO_MANY_REQUESTS {
        return "Wait a moment and retry, or reduce request frequency.".to_string();
    }
    if status.is_server_error() {
        return "Retry in a few moments. If the issue persists, contact support with the request ID.".to_string();
    }
    format!("See {} for help.", crate::cli::DOCS_URL)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_api_error_envelope() {
        let body = r#"{"error":{"code":"unauthorized","message":"Invalid API key","details":"Unauthorized"},"request_id":"abc-123"}"#;
        let err = ApiError::from_response(StatusCode::UNAUTHORIZED, body);
        assert_eq!(err.code, "unauthorized");
        assert_eq!(err.message, "Invalid API key");
        assert_eq!(err.request_id.as_deref(), Some("abc-123"));
        assert!(err.is_unauthorized());
        assert!(err.hint.contains("lomi login"));
    }

    #[test]
    fn handles_unparseable_body() {
        let err = ApiError::from_response(StatusCode::INTERNAL_SERVER_ERROR, "bad gateway");
        assert_eq!(err.code, "server_error");
        assert!(err.message.contains("unavailable"));
    }
}
