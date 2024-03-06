import ts from "typescript"

interface CodeFile {
    name: string;
    code: string;
    version: number;
    snapshot: ts.IScriptSnapshot;
}
const cache: Record<string, CodeFile> = {};
type DisplaySymbol = string | [string, string];

const infoNoStyleKinds = {
    space: true,
    text: true,
    lineBreak: true,
    punctuation: true
}

function displayPartsToString(tokens: ts.SymbolDisplayPart[]) {
    const result: DisplaySymbol[] = [];

    for (const token of tokens) {
        if (infoNoStyleKinds[token.kind as keyof typeof infoNoStyleKinds]) {
            const lastText = result[result.length - 1];

            if (typeof lastText == 'string') {
                result.splice(result.length - 1, 1, lastText + token.text);
            } else {
                result.push(token.text);
            }
        } else {
            result.push([token.kind, token.text]);
        }
    }

    return encodeURI(JSON.stringify(result));
}
let tsServer:TsServer
export class TsServer {
    private readonly scriptKind = 'ts';

    private readonly platform = 'browser';

    private readonly server: ts.LanguageService;

    readonly files = new Set<string>();

    private current!: CodeFile;

    private version = 0;

    constructor() {
        this.setFile('');
        this.server = ts.createLanguageService(this.createLanguageServiceHost());
    }
    private getScriptSnapshot(code: string): ts.IScriptSnapshot {
        return {
          getText: (start, end) => code.substring(start, end),
          getLength: () => code.length,
          getChangeRange: () => void 0,
        };
    }

    private getCurrentName() {
        return `_template.${this.scriptKind}`
    }

    getAllFileNames() {
        if (this.current) {
            this.files.add(this.current.name)
        }

        this.files.add('node_modules/typescript/lib/lib.esnext.d.ts')

        this.files.add('node_modules/typescript/lib/lib.dom.d.ts')

        return Array.from(this.files.keys());
    }

    private createLanguageServiceHost(): ts.LanguageServiceHost {
        return {
            readFile: () => undefined,
            fileExists: () => false,
            getDefaultLibFileName: ts.getDefaultLibFilePath,
            getCompilationSettings(): ts.CompilerOptions {
                return {
                    strict: false,
                    allowJs: true,
                    jsx: ts.JsxEmit.React,
                    allowSyntheticDefaultImports: true,
                    allowNonTsExtensions: true,
                    target: ts.ScriptTarget.Latest,
                    moduleResolution: ts.ModuleResolutionKind.NodeNext,
                    module: ts.ModuleKind.ESNext,
                    lib: [],
                    types: [],
                };
            },
            getScriptFileNames: () => {
                return this.getAllFileNames();
            },
            getProjectVersion: () => {
                return String(this.version);
            },
            getScriptVersion: (filePath) => {
                if (this.current && filePath === this.current.name) {
                    return String(this.current.version);
                } else if (cache[filePath]) {
                    return String(cache[filePath].version);
                } else {
                    return '0';
                }
            },
            getScriptSnapshot: (filePath) => {
                if (filePath === this.current?.name) {
                    return this.current.snapshot;
                } else if (cache[filePath]) {
                    
                    this.files.add(filePath);
                    return cache[filePath].snapshot;
                } else {
                    
                    const fileText = ts.sys.readFile(filePath) ?? '';
                    const file: CodeFile = {
                        name: filePath,
                        code: fileText,
                        version: 1,
                        snapshot: this.getScriptSnapshot(fileText),
                    };

                    this.files.add(filePath);
                    cache[filePath] = file;
                    return file.snapshot;
                }
            },
            resolveModuleNames: (
                moduleNames,
                containingFile,
                reusedNames,
                redirectedReference,
                options,
            ): (ts.ResolvedModule | undefined)[] => {
                return moduleNames.map((name) => {
                    return ts.resolveModuleName(name, containingFile, options, ts.sys).resolvedModule;
                });
            },
            getNewLine: () => '\n',
            getCurrentDirectory: () => '',
            useCaseSensitiveFileNames: () => true,
        };
    }

    setFile(code: string) {
        const name = this.getCurrentName();

        if (code === this.current?.code) {
            return;
        }

        this.version++;
        this.current = {
            name,
            code,
            snapshot: this.getScriptSnapshot(code),
            version: (this.current?.version ?? 0) + 1,
        };
    }

    getQuickInfoAtPosition(offset: number) {
        const infos = this.server.getQuickInfoAtPosition(this.current.name, offset);
        if (!infos || !infos.displayParts) {
            return '';
        }

        return displayPartsToString(infos.displayParts);
    }
}

export function initTsServer(){
    tsServer = new TsServer();
    tsServer.getAllFileNames()
}
export function getTsServer() {
    return tsServer
}
