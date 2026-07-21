import tarfile
import tomllib
import unittest
import zipfile
from pathlib import Path

import yaml


MODULE_ROOT = Path(__file__).parents[1]
SKILL_ROOT = MODULE_ROOT / "skills" / "xq-kraken"


class SkillAssetsTest(unittest.TestCase):
    def test_skill_metadata_is_complete(self) -> None:
        text = (SKILL_ROOT / "SKILL.md").read_text(encoding="utf-8")
        _, frontmatter, body = text.split("---", maxsplit=2)
        metadata = yaml.safe_load(frontmatter)

        self.assertEqual(metadata["name"], "xq-kraken")
        self.assertIn("OpenAPI", metadata["description"])
        self.assertIn("kraken.yaml", metadata["description"])
        self.assertIn("## Run the Operation Workflow", body)
        self.assertNotIn("TODO", text)

    def test_agent_interface_names_the_skill(self) -> None:
        metadata = yaml.safe_load((SKILL_ROOT / "agents" / "openai.yaml").read_text(encoding="utf-8"))
        interface = metadata["interface"]

        self.assertEqual(interface["display_name"], "XQ Kraken")
        self.assertIn("$xq-kraken", interface["default_prompt"])

    def test_build_configuration_ships_the_skill(self) -> None:
        config = tomllib.loads((MODULE_ROOT / "pyproject.toml").read_text(encoding="utf-8"))
        targets = config["tool"]["hatch"]["build"]["targets"]

        self.assertEqual(
            targets["wheel"]["force-include"]["skills/xq-kraken"],
            "skills/xq-kraken",
        )
        self.assertIn("/skills", targets["sdist"]["include"])

    def test_built_artifacts_contain_the_skill_when_available(self) -> None:
        wheels = sorted((MODULE_ROOT / "dist").glob("xq_kraken-*.whl"))
        source_archives = sorted((MODULE_ROOT / "dist").glob("xq_kraken-*.tar.gz"))
        if not wheels or not source_archives:
            self.skipTest("build artifacts are not present; run the module build")

        expected = {
            "skills/xq-kraken/SKILL.md",
            "skills/xq-kraken/agents/openai.yaml",
        }
        with zipfile.ZipFile(wheels[-1]) as wheel:
            self.assertTrue(expected.issubset(wheel.namelist()))

        with tarfile.open(source_archives[-1], "r:gz") as source_archive:
            names = {name.split("/", maxsplit=1)[-1] for name in source_archive.getnames()}
            self.assertTrue(expected.issubset(names))


if __name__ == "__main__":
    unittest.main()
