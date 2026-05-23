const ts = require('typescript');
const configPath = ts.findConfigFile('./', ts.sys.fileExists, 'tsconfig.json');
const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, './');
const program = ts.createProgram(parsed.fileNames, parsed.options);
const sourceFile = program.getSourceFile('src/lib/store.tsx');
if (!sourceFile) { console.error('no source file'); process.exit(1); }
const checker = program.getTypeChecker();
const importDecl = sourceFile.statements.find(s => ts.isImportDeclaration(s) && s.moduleSpecifier.text === './eventsData');
console.log('importDecl', !!importDecl);
if (importDecl && ts.isImportDeclaration(importDecl)) {
  const importClause = importDecl.importClause;
  if (importClause && importClause.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
    for (const element of importClause.namedBindings.elements) {
      const name = element.name.text;
      console.log('import element', name, ts.isIdentifier(element.name), element.propertyName?.text);
      if (name === 'Event') {
        const sym = checker.getSymbolAtLocation(element.name);
        console.log('symbol', sym && sym.name);
        if (sym) {
          const decs = sym.declarations || [];
          console.log('declaration count', decs.length);
          for (const d of decs) {
            console.log('decl kind', ts.SyntaxKind[d.kind], d.getText().slice(0,200));
          }
          const type = checker.getTypeAtLocation(element.name);
          console.log('type string', checker.typeToString(type));
        }
      }
    }
  }
}
