/**
 * Converts JUnit XML test results to markdown format
 * @param xmlContent - The JUnit XML content as a string
 * @returns A promise that resolves to markdown formatted test results
 */
export declare function generateMarkdownFromJunit(xmlContent: string): Promise<string>;
