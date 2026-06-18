use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct MeResponse {
    pub merchant_id: String,
    pub organization_id: String,
    pub organization_name: String,
    pub environment: String,
}
