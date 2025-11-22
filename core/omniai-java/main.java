
---

## Java Core (`core/omniai-java/`)

### `core/omniai-java/Main.java`

```java
public class Main {
    public static void main(String[] args) {
        System.out.println("OmniAI Java Core");
        System.out.println("=================");

        String[][] modules = {
            { "Jargon Linker", "Personal terminology SPA, stored locally." },
            { "Math / Tutor Engine", "Step-by-step math explanations and PDFs." },
            { "Network / DNS Lab Assistant", "Guides and helpers for SEED labs." },
            { "Digital Footprint Removal", "Broker tracking and notes." }
        };

        String[][] standards = {
            { "hit_me", "Display full code bundle, ready-to-run." },
            { "transcend", "Package latest relevant work into a ZIP/PDF bundle." },
            { "functional_textbuild", "Every code file has a .txt mirror with identical content." },
            { "standard_pdf_style", "Times New Roman, 12pt, 0.5 inch margins." }
        };

        System.out.println("OmniAI Modules:");
        for (String[] m : modules) {
            System.out.println(" - " + m[0] + " :: " + m[1]);
        }

        System.out.println();
        System.out.println("Kai / OmniAI Standards:");
        for (String[] s : standards) {
            System.out.println(" - " + s[0] + ": " + s[1]);
        }

        System.out.println();
        System.out.println("This is a demo Java core. On your Raspberry Pi, you can extend this into a real service.");
    }
}
