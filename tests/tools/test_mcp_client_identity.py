def test_new_oauth_clients_use_hebri_identity_without_overwriting_explicit_clients():
    from tools.mcp_oauth import apply_oauth_provider_defaults, _build_client_metadata, _maybe_use_cimd
    cfg = apply_oauth_provider_defaults({"_resolved_port": 27890}, server_url="https://mcp.figma.com/mcp")
    assert _build_client_metadata(cfg).client_name == "Hebri"
    explicit = apply_oauth_provider_defaults({"client_id": "assigned-by-provider", "client_name": "Our approved Hebri app"}, server_url="https://mcp.figma.com/mcp")
    assert explicit["client_id"] == "assigned-by-provider"
    assert _maybe_use_cimd(explicit) is None
