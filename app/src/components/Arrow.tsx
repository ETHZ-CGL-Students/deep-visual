import * as React from 'react';

type Vector2 = { x: number; y: number };

export const Arrow = ({ from, to }: { from: Vector2; to: Vector2 }) => {
	const dy = to.y - from.y;
	const dx = to.x - from.x;

	const angle = Math.atan2(dy, dx);
	const length = Math.sqrt(dx * dx + dy * dy);

	const style: React.CSSProperties = {
		position: 'absolute',
		left: from.x,
		top: from.y,
		transform: `rotate(${angle}rad)`,
		transformOrigin: '0 0',
		width: length,
		height: 0
	};

	return (
		<div style={style}>
			<div style={{ background: 'green', height: 4, marginRight: 20 }} />
			<div
				style={{
					width: 0,
					height: 0,
					marginRight: 6,
					marginTop: -17,
					borderTop: '14px solid transparent',
					borderBottom: '14px solid transparent',
					borderLeft: '22px solid green',
					float: 'right'
				}}
			/>
		</div>
	);
};
