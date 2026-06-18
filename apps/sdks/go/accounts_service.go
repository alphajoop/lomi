// AUTO-GENERATED — public merchant allowlist
package lomi

import (
	"encoding/json"
	"strings"
)

type AccountsService struct {
	client *Client
}

func (s *AccountsService) CheckBalance(currency string) (interface{}, error) {
		path := "/accounts/balance/check/{currency}"
		path = strings.ReplaceAll(path, "{currency}", currency)
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


func (s *AccountsService) GetBalance(params map[string]string) (interface{}, error) {
		path := "/accounts/balance"
		bodyResp, err := s.client.doRequest("GET", path, paramsToQuery(params), nil)
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


func (s *AccountsService) GetBalanceBreakdown(params map[string]string) (interface{}, error) {
		path := "/accounts/balance/breakdown"
		bodyResp, err := s.client.doRequest("GET", path, paramsToQuery(params), nil)
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

