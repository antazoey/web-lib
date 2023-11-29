import React from 'react';

import type {ReactElement} from 'react';

export function IconDashboard(props: React.SVGProps<SVGSVGElement>): ReactElement {
	return (
		<svg
			fill={'none'}
			xmlns={'http://www.w3.org/2000/svg'}
			viewBox={'0 0 448 512'}
			{...props}>
			<path
				d={
					'M0 80C0 53.49 21.49 32 48 32H144C170.5 32 192 53.49 192 80V240C192 266.5 170.5 288 144 288H48C21.49 288 0 266.5 0 240V80zM32 80V240C32 248.8 39.16 256 48 256H144C152.8 256 160 248.8 160 240V80C160 71.16 152.8 64 144 64H48C39.16 64 32 71.16 32 80zM256 272C256 245.5 277.5 224 304 224H400C426.5 224 448 245.5 448 272V432C448 458.5 426.5 480 400 480H304C277.5 480 256 458.5 256 432V272zM288 272V432C288 440.8 295.2 448 304 448H400C408.8 448 416 440.8 416 432V272C416 263.2 408.8 256 400 256H304C295.2 256 288 263.2 288 272zM144 320C170.5 320 192 341.5 192 368V432C192 458.5 170.5 480 144 480H48C21.49 480 0 458.5 0 432V368C0 341.5 21.49 320 48 320H144zM144 352H48C39.16 352 32 359.2 32 368V432C32 440.8 39.16 448 48 448H144C152.8 448 160 440.8 160 432V368C160 359.2 152.8 352 144 352zM256 80C256 53.49 277.5 32 304 32H400C426.5 32 448 53.49 448 80V144C448 170.5 426.5 192 400 192H304C277.5 192 256 170.5 256 144V80zM288 80V144C288 152.8 295.2 160 304 160H400C408.8 160 416 152.8 416 144V80C416 71.16 408.8 64 400 64H304C295.2 64 288 71.16 288 80z'
				}
				fill={'currentcolor'}
			/>
		</svg>
	);
}
