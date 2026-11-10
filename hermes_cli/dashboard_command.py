"""Parse dashboard launch identity without matching prose or other commands."""

from hermes_cli._subprocess_compat import split_command_line


def dashboard_runtime(command: str) -> tuple[str, str, int] | None:
    from hermes_cli._parser import top_level_value_flag_sets

    try:
        argv = split_command_line(command)
    except ValueError:
        return None
    if not argv:
        return None
    base = lambda value: value.replace("\\", "/").rsplit("/", 1)[-1].lower()
    launchers = {"hebri", "hebri.exe", "hermes", "hermes.exe"}
    if base(argv[0]) in launchers:
        start = 1
    elif base(argv[0]).startswith(("python", "pypy")):
        if len(argv) > 2 and argv[1] == "-m" and argv[2] in {"hermes_cli.hebri", "hermes_cli.main"}:
            start = 3
        elif len(argv) > 1 and (base(argv[1]) in launchers or argv[1].replace("\\", "/").endswith("hermes_cli/main.py")):
            start = 2
        else:
            return None
    else:
        return None
    required, optional = top_level_value_flag_sets()
    required = required | {"--profile", "-p"}
    index = start
    while index < len(argv) and argv[index].startswith("-"):
        flag = argv[index].split("=", 1)[0]
        if "=" not in argv[index] and (flag in required or (
                flag in optional and index + 1 < len(argv) and not argv[index + 1].startswith("-"))):
            index += 1
        index += 1
    if index >= len(argv) or argv[index] not in {"dashboard", "serve"}:
        return None
    mode, host, port = argv[index], "127.0.0.1", 9119
    index += 1
    while index < len(argv):
        flag, sep, value = argv[index].partition("=")
        if flag in {"--port", "--host"}:
            if not sep:
                index += 1
                if index >= len(argv):
                    return None
                value = argv[index]
            if flag == "--host":
                host = value
            else:
                try:
                    port = int(value)
                except ValueError:
                    return None
                if not 0 <= port <= 65535:
                    return None
        index += 1
    return mode, host, port
