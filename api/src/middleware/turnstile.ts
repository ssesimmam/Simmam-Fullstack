import fetch from 'node-fetch';
import { Request, Response, NextFunction } from 'express';

// Read at call-time, not module-load time, so dotenv.config() in index.ts
// (which runs after imports are hoisted) is already applied when we need the values.
const getTurnstileSecret = () =>
  process.env.TURNSTILE_SECRET_KEY ||
  process.env.TURNSTILE_SECRET ||
  process.env.CLOUDFLARE_TURNSTILE_SECRET;
const isDevSkip = () => process.env.DEV_SKIP_TURNSTILE === 'true';

type TurnstileResponse = {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
  action?: string;
  cdata?: string;
};

export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string
): Promise<{
  success: boolean;
  data?: TurnstileResponse;
  error?: string;
}> {
  try {
    const TURNSTILE_SECRET = getTurnstileSecret();
    // Validate secret exists
    if (!TURNSTILE_SECRET) {
      console.error('Turnstile secret is missing. Set TURNSTILE_SECRET_KEY, TURNSTILE_SECRET, or CLOUDFLARE_TURNSTILE_SECRET.');

      return {
        success: false,
        error: 'missing_secret_key',
      };
    }

    // Validate token exists
    if (!token || typeof token !== 'string') {
      console.error('Turnstile token missing or invalid');

      return {
        success: false,
        error: 'missing_token',
      };
    }

    const params = new URLSearchParams();

    params.append('secret', TURNSTILE_SECRET);
    params.append('response', token);

    if (remoteIp) {
      params.append('remoteip', remoteIp);
    }

    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      }
    );

    if (!response.ok) {
      console.error(
        'Turnstile API request failed:',
        response.status,
        response.statusText
      );

      return {
        success: false,
        error: 'turnstile_api_failed',
      };
    }

    const data = (await response.json()) as TurnstileResponse;

    // TEMP DEBUG LOG
    console.log('TURNSTILE VERIFY RESPONSE:', data);

    return {
      success: data.success === true,
      data,
    };
  } catch (error) {
    console.error('Turnstile verification error:', error);

    return {
      success: false,
      error: 'verification_exception',
    };
  }
}

export async function requireTurnstile(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // TEMP DEBUG LOG
    console.log('REQUEST BODY:', req.body);

    // Dev bypass for local debugging
    if (isDevSkip()) {
      console.warn('DEV_SKIP_TURNSTILE is enabled — skipping Turnstile verification');
      return next();
    }

    // Support both snake_case and camelCase
    const token =
      req.body?.turnstile_token ||
      req.body?.turnstileToken ||
      req.headers['x-turnstile-token'];

    const ip =
      (req.headers['cf-connecting-ip'] as string) ||
      req.ip ||
      undefined;

    if (!token) {
      return res.status(400).json({
        error: 'missing_turnstile_token',
      });
    }

    const result = await verifyTurnstileToken(
      String(token),
      ip
    );

    if (!result.success) {
      console.error('TURNSTILE FAILED:', result);

      return res.status(403).json({
        error: 'turnstile_failed',
        details: result,
      });
    }

    return next();
  } catch (error) {
    console.error('Turnstile middleware error:', error);

    return res.status(500).json({
      error: 'turnstile_error',
    });
  }
}