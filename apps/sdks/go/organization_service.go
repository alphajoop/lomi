// AUTO-GENERATED — public merchant allowlist
package lomi

import (
	"encoding/json"
)

type OrganizationService struct {
	client *Client
}

func (s *OrganizationService) GetSettings() (interface{}, error) {
		path := "/organization/radar-settings"
		bodyResp, err := s.client.doRequest("GET", path, nil, nil)
		if err != nil {
			return nil, err
		}
		if len(bodyResp) == 0 {
			return nil, nil
		}
		var out interface{}
		if err := json.Unmarshal(bodyResp, &out); err != nil {
			return nil, err
		}
		return out, nil
	}


func (s *OrganizationService) UpdateSettings(body interface{}) (interface{}, error) {
		path := "/organization/radar-settings"
		bodyResp, err := s.client.doRequest("PATCH", path, nil, body)
		if err != nil {
			return nil, err
		}
		if len(bodyResp) == 0 {
			return nil, nil
		}
		var out interface{}
		if err := json.Unmarshal(bodyResp, &out); err != nil {
			return nil, err
		}
		return out, nil
	}

