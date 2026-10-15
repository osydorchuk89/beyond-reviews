import { useRef, useState } from "react";
import { BaseTab } from "./BaseTab";

interface MediaTabsProps<T extends string> {
    id: string;
    label: string;
    tabs: { value: T; label: string }[];
    selected: T;
    onSelect: (value: T) => void;
}

export const MediaTabs = <T extends string>({
    id,
    label,
    tabs,
    selected,
    onSelect,
}: MediaTabsProps<T>) => {
    const listRef = useRef<HTMLDivElement>(null);
    const [focused, setFocused] = useState(selected);

    return (
        <div
            ref={listRef}
            role="tablist"
            aria-label={label}
            className="flex flex-wrap justify-center gap-2"
            onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget))
                    setFocused(selected);
            }}
        >
            {tabs.map((tab, index) => (
                <BaseTab
                    key={tab.value}
                    id={`${id}-tab-${tab.value}`}
                    role="tab"
                    aria-selected={selected === tab.value}
                    aria-controls={`${id}-panel`}
                    tabIndex={focused === tab.value ? 0 : -1}
                    isSelected={selected === tab.value}
                    onFocus={() => setFocused(tab.value)}
                    onClick={() => onSelect(tab.value)}
                    onKeyDown={(event) => {
                        let next: number;
                        switch (event.key) {
                            case "ArrowRight":
                                next = (index + 1) % tabs.length;
                                break;
                            case "ArrowLeft":
                                next = (index - 1 + tabs.length) % tabs.length;
                                break;
                            case "Home":
                                next = 0;
                                break;
                            case "End":
                                next = tabs.length - 1;
                                break;
                            default:
                                return;
                        }
                        event.preventDefault();
                        listRef.current
                            ?.querySelectorAll<HTMLButtonElement>(
                                '[role="tab"]',
                            )
                            [next]?.focus();
                    }}
                >
                    {tab.label}
                </BaseTab>
            ))}
        </div>
    );
};
