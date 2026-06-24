import { ButtonLink } from "../../../ui/ButtonLink";

interface WishlistEmptyStateProps {
    isSameUser: boolean;
    profileUserName: string;
    mediaLabel: string;
    exploreTo?: string;
    exploreLabel?: string;
}

export const WishlistEmptyState = ({
    isSameUser,
    profileUserName,
    mediaLabel,
    exploreTo,
    exploreLabel,
}: WishlistEmptyStateProps) => (
    <div className="flex flex-col justify-center items-center gap-10 min-h-[45vh] text-center">
        <p className="text-lg break-words">
            There are no {mediaLabel} on{" "}
            {isSameUser ? "your" : `${profileUserName}'s`} wishlist
        </p>
        {isSameUser && exploreTo && exploreLabel && (
            <ButtonLink style="orange" to={exploreTo}>
                {exploreLabel}
            </ButtonLink>
        )}
    </div>
);
