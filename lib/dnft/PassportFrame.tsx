function getLevelColor(level: number) {
    if (level >= 4) return "#ec4899";
    if (level === 3) return "#f59e0b";
    if (level === 2) return "#8b5cf6";
    if (level === 1) return "#3b82f6";  

    return "#9ca3af";
}

type PassportFrameProps = {
    level: number;
};

export function PassportFrame({ level }: PassportFrameProps){
    const levelColor = getLevelColor(level);

    return(
        <>
            <rect
                x="10"
                y="10"
                width="300"
                height="400"
                rx="18"
                fill="#ffffff"
                stroke={levelColor}
                strokeWidth="5"
            />

            {level >= 1 && (
                <>
                <rect
                    x="22"
                    y="22"
                    width="276"
                    height="376"
                    rx="14"
                    fill="none"
                    stroke={levelColor}
                    strokeWidth="2"
                    opacity="0.55"
                />

                <path
                    d="M32 52 L32 32 L52 32"
                    fill="none"
                    stroke={levelColor}
                    strokeWidth="3"
                    strokeLinecap="round"
                />

                <path
                    d="M268 32 L288 32 L288 52"
                    fill="none"
                    stroke={levelColor}
                    strokeWidth="3"
                    strokeLinecap="round"
                />

                <path
                    d="M32 368 L32 388 L52 388"
                    fill="none"
                    stroke={levelColor}
                    strokeWidth="3"
                    strokeLinecap="round"
                />

                <path
                    d="M268 388 L288 388 L288 368"
                    fill="none"
                    stroke={levelColor}
                    strokeWidth="3"
                    strokeLinecap="round"
                />

                <circle cx="32" cy="32" r="3" fill={levelColor} />
                <circle cx="288" cy="32" r="3" fill={levelColor} />
                <circle cx="32" cy="388" r="3" fill={levelColor} />
                <circle cx="288" cy="388" r="3" fill={levelColor} />
                </>
            )}
        </>
    );
}