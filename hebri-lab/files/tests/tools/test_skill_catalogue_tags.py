from tools import skills_tool


def test_catalogue_reads_skill_tags_without_changing_the_agent_list(tmp_path, monkeypatch):
    root = tmp_path / "skills"
    monkeypatch.setenv("HERMES_HOME", str(tmp_path))
    monkeypatch.setattr(skills_tool, "_skills_dir", lambda: root)
    monkeypatch.setattr(skills_tool, "_skill_search_dirs", lambda: ([], [root], root))
    monkeypatch.setattr(skills_tool, "_SKILLS_CACHE", {})
    documents = {
        "weekly-review": "metadata:\n  hermes:\n    tags: [expert, review]",
        "notes": "tags: [everyday]",
    }
    for name, metadata in documents.items():
        directory = root / "productivity" / name
        directory.mkdir(parents=True)
        (directory / "SKILL.md").write_text(
            f"---\nname: {name}\ndescription: Review notes.\n{metadata}\n---\nInstructions.\n",
            encoding="utf-8")

    plain = skills_tool._find_all_skills(skip_disabled=True)
    catalogue = skills_tool._find_all_skills(skip_disabled=True, include_tags=True)
    assert {row["name"]: row["tags"] for row in catalogue} == {
        "weekly-review": ["expert", "review"], "notes": ["everyday"]}
    assert len(plain) == 2
    assert all("tags" not in row for row in plain)
    assert skills_tool._find_all_skills(skip_disabled=True) == plain
