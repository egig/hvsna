import { Block, Navbar, Page } from "framework7-react";
import { TextEditor } from "../components/text-editor";

export default function Template() {
    return (
        <Page>
            <Navbar backLink title="Template"></Navbar>
            <Block>
                <TextEditor instanceID="template"/>
            </Block>
        </Page>
    );
}