import { TokenType } from "../enum";

export interface RefreshPayload {
  payload: {
    token_id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    language?: string;
    token_type: TokenType;
  };
}
