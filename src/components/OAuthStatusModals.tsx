type OAuthStatusModalsProps = {
  oauthLoading: boolean;
  oauthError: string | null;
  onClearError: () => void;
};

export function OAuthStatusModals({ oauthLoading, oauthError, onClearError }: OAuthStatusModalsProps) {
  return (
    <>
      {oauthLoading && (
        <div className="modal-backdrop">
          <div className="modal max-w-xs space-y-3 text-left">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-(--border-color) border-t-(--text-color)" />
            <p className="text-sm">Exchanging the code for an OpenRouter key.</p>
          </div>
        </div>
      )}

      {oauthError && (
        <div className="modal-backdrop">
          <div className="modal max-w-md space-y-4">
            <h3 className="text-base font-semibold">Could not sign in</h3>
            <div className="alert alert-danger text-sm">{oauthError}</div>
            <div className="flex justify-end">
              <button className="btn primary text-xs" onClick={onClearError} type="button">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
