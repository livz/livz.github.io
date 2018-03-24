---
title: Sandboxing And Entitlements
layout: tip
date: 2018-01-24
published: true
---

## Context

### Sandboxing
* All applications distributed via the App Store must run inside a sandbox. 
* Sandboxing is enabled using the __App Sandbox__ entitlements.
* ```asctl``` (**_App Sandbox Control Tool_**) is a command line tool for manipulating the container of an applications using App Sandbox. 
* Per-application containers are rooted in ```~/Library/Containers```.


### Entitlements

* Entitlements confer additional capabilities or permissions needed by an application.
* Entitlements must be specified during the code signing process.
* Entitlements are part of the application container's plist (_more about this below_).

## Use cases

### Check whether an app is signed with _App Sandbox_ entitlement
 
```bash
$ asctl sandbox check  TextEdit
/Applications/TextEdit.app:
	signed with App Sandbox entitlements
```

### Check whether an app is running with _App Sandbox_ enabled

```bash
$ asctl sandbox check --pid 3560
/Applications/TextEdit.app:
	signed with App Sandbox entitlements
	running with App Sandbox enabled
	container path is ~/Library/Containers/com.apple.TextEdit/Data
```

### View entitlements of an application

* **Method 1** - Since we know that entitlements are mentioned in the application container's plist, we can locate and convert the binary .plist file to XML. The entitlements the app has been granted will be specified under the **```SandboxProfileDataValidationEntitlementsKey```** key:

```bash
$ cp ~/Library/Containers/com.apple.TextEdit/Container.plist .
$ plutil -convert xml1 Container.plist
$ cat Container.plist
[..]
	<key>SandboxProfileDataValidationEntitlementsKey</key>
		<dict>
			<key>com.apple.application-identifier</key>
			<string>com.apple.TextEdit</string>
			<key>com.apple.developer.ubiquity-container-identifiers</key>
			<array>
				<string>com.apple.TextEdit</string>
			</array>
			<key>com.apple.security.app-sandbox</key>
			<true/>
			<key>com.apple.security.files.user-selected.executable</key>
			<true/>
			<key>com.apple.security.files.user-selected.read-write</key>
			<true/>
			<key>com.apple.security.print</key>
			<true/>
		</dict>
```
* **Method 2** - Use the ```codesign``` utility to __*extract any entitlement data from the signature of the app*__:

```bash
$ codesign --display  --entitlements - /Applications/TextEdit.app
Executable=/Applications/TextEdit.app/Contents/MacOS/TextEdit
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>com.apple.application-identifier</key>
	<string>com.apple.TextEdit</string>
	<key>com.apple.developer.ubiquity-container-identifiers</key>
	<array>
		<string>com.apple.TextEdit</string>
	</array>
	<key>com.apple.security.app-sandbox</key>
	<true/>
	<key>com.apple.security.files.user-selected.read-write</key>
	<true/>
	<key>com.apple.security.files.user-selected.executable</key>
	<true/>
	<key>com.apple.security.print</key>
	<true/>
</dict>
</plist>
```

### Collect diagnostic information about an app

```bash
$ sudo asctl diagnose app --file /Applications/TextEdit.app
Password:
This diagnostic tool generates files that allow Apple to investigate issues with your computer and help Apple to improve its products. The generated files may contain some of your personal information, which may include, but not be limited to, the serial number or similar unique number for your device, your user name, your file names or your computer name. The information is used by Apple in accordance with its privacy policy (www.apple.com/privacy) and is not shared with any third party. By enabling this diagnostic tool and sending a copy of the generated files to Apple, you are consenting to Apple's use of the content of such files.

Press 'Enter' to continue.

2018-03-24 14:53:08.759 asctl[3635:44892] Executing '/usr/libexec/AppSandbox/container_check.rb --for-user m --stdout'...
```

## References

* [About Entitlements](https://developer.apple.com/library/content/documentation/Miscellaneous/Reference/EntitlementKeyReference/Chapters/AboutEntitlements.html)
