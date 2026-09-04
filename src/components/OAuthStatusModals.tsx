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
          <div className="modal glass max-w-xs text-center space-y-4">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold">Exchanging code for OpenRouter API key...</p>
          </div>
        </div>
      )}

      {oauthError && (
        <div className="modal-backdrop">
          <div className="modal glass max-w-md space-y-4">
            <h3 className="text-lg font-bold text-red-400">Login error</h3>
            <div className="alert alert-danger text-xs font-mono">{oauthError}</div>
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
