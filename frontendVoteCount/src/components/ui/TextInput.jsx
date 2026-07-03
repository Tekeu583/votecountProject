import { forwardRef } from 'react';

const TextInput = forwardRef(
    (
        {
            label,
            name,
            value,
            onChange,
            type = 'text',
            placeholder = '',
            error,
            disabled = false,
            required = false,
            iconLeft: IconLeft,
            iconRight: IconRight,
            onIconRightClick,
            className = '',
        },
        ref
    ) => {
        return (
            <div className="flex flex-col gap-1.5 w-full">

                {/* Label */}
                {label && (
                    <label className="text-sm text-[var(--color-gray-dark)]">
                        {label}
                        {required && <span className="text-[var(--color-danger)] text-base leading-none m-1">*</span>}
                    </label>
                )}

                {/* Input wrapper */}
                <div className="relative flex items-center">

                    {/* Left icon */}
                    {IconLeft && (
                        <IconLeft
                            size={16}
                            className="absolute left-3 text-[var(--color-gray)]"
                        />
                    )}

                    {/* Input */}
                    <input
                        ref={ref}
                        name={name}
                        type={type}
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        disabled={disabled}
                        required={required}
                        className={`
                        w-full
                        border
                        rounded-[var(--radius-md)]
                        px-3 py-2
                        text-[var(--text-base)]
                        text-[var(--color-dark)]
                        bg-[var(--color-white)]
                        transition ${className}

                        /* Padding dynamique selon icône */
                        ${IconLeft ? 'pl-10' : ''}
                        ${IconRight ? 'pr-10' : ''}

                        /* Focus */
                        focus:outline-none
                        focus:ring-2
                        focus:ring-[var(--color-primary)]
                        focus:border-transparent

                        /* Error state */
                        ${error ? 'border-[var(--color-danger)]' : 'border-[var(--color-gray-light)]'}

                        /* Disabled */
                        disabled:bg-[var(--color-gray-light)]
                        disabled:cursor-not-allowed
                        disabled:opacity-70
                        `}
                    />

                    {/* Right icon */}
                    {IconRight && (
                        <button
                            type="button"
                            onClick={onIconRightClick}
                            className="absolute right-3 text-[var(--color-gray)] cusor-pointer"
                            tabIndex={-1}
                        >
                            <IconRight size={16} />
                        </button>
                    )}
                </div>

                {/* Error message */}
                {error && (
                    <p className="text-xs text-[var(--color-danger)]">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

export default TextInput;
