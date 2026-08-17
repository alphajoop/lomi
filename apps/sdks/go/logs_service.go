// AUTO-GENERATED — public merchant allowlist
package lomi

import (
	"encoding/json"
	"strings"
)

type LogsService struct {
	client *Client
}

func (s *LogsService) Get(id string, params map[string]string) (interface{}, error) {
		path := "/logs/{id}"
		path = strings.ReplaceAll(path, "{id}", id)
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


func (s *LogsService) List(params map[string]string) (interface{}, error) {
		path := "/logs"
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

