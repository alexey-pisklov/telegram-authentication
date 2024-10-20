import {Authentication} from "authentication";

import {TelegramAuthenticationWindowOptions} from "./telegram-authentication-window.options";
import {TelegramAuthenticationData} from "./telegram-authentication.data";


type TelegramWindowOptions = TelegramAuthenticationWindowOptions | undefined;

export abstract class TelegramAuthentication<TUser> implements Authentication<TelegramWindowOptions, TUser | null> {
    protected readonly authentication_url: string;

    constructor(bot_id: string, origin?: string, returnUrl?: string) {
        const url = new URL('https://oauth.telegram.org/auth');
        url.searchParams.set('bot_id', encodeURIComponent(bot_id))
        url.searchParams.set('origin', origin ?? location.origin);
        url.searchParams.set('return_to', returnUrl ?? location.href);

        this.authentication_url = url.toString();
    }

    protected abstract validate(data: TelegramAuthenticationData): Promise<TUser | null>;

    async authenticate(options: TelegramWindowOptions): Promise<TUser | null> {
        const window_name = options?.name ?? 'telegram_authentication_window';
        const window_width = options?.width ?? 550;
        const window_height = options?.height ?? 470;
        const window_position_left = options?.left ?? ((screen.width - window_width) / 2) + screen.availWidth;
        const window_position_top = options?.top ?? ((screen.height - window_height) / 2) + screen.availHeight;

        return new Promise<TUser | null>((resolve, reject) => {
            const popup = window.open(
                this.authentication_url,
                window_name,
                `width=${window_width},height=${window_height},left=${window_position_left},top=${window_position_top},status=0,location=0,menubar=0,toolbar=0`
            );

            if (popup) {
                popup.focus();
            }

            const onMessage = (event: MessageEvent) => {
                const data = JSON.parse(event.data);

                resolve(this.validate(data.result));

                window.removeEventListener('message', onMessage);
            };

            window.addEventListener('message', onMessage);
        });
    }
}
