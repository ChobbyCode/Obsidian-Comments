# <div align="center">Obsidian Comments</div>

<img src="https://github.com/ChobbyCode/Obsidian-Comments/blob/master/resources/overview.gif?raw=true" alt="drawing" width="100%"> 

## Overview

Obsidian Comments is the easiest way to add advanced comments to Obsidian.md. All you have to do is to highlight the text you want to comment, right click it and click 'Add Comment', a modal will then appaer which information can be filled in on. 

Obsidian Comments works by storing comments in a seperate comments.json file parallel to your usual mark down file, so if you have a note called "Note.md" and you added a comment to it, it would create a file called "Note.md.comments.json". This means notes created within the plugin are compatable with people who don't have the plugin. This also means you can turn the plugin off and on as you wish. The plugin does not affect your notes at all. 

## Installation

Unfortuantly, you cannot download the plugin directly from the Obsidian Marketplace because this is just a personal project for myself to solve a personal problem. However, if I feel like fleshing this out fully, and ironing out all the bugs, and issues then this will be how you install it.

For now, to install the application you must navigate to the releases tap, and download the zip file from there. Unzip it and add this to your plugins directory of your vault. More details are available on the releases tap. 

## Usage

### Opening The Comments View

To view existing comments, you have to open the comments view. This can be done by enabling the extension and clicking the dice that appears on the left-hand-side tool bar. This will open a new view. The view usually opens on the right, however this may depend. This is a clunky way to open the app, so I may change this if I decide to flesh it out fully again.

### Creating New Comments

To create a comment, highlight over text you want to apply a comment to in the editor. 
Then either:
a) Press Mod+P to open the command pallete, and search for add comment which will then open the modal popup
b) Right click on the highlighted text, and press the 'Add Comment' option
c) Add a custom keybind to the Add Comment function in the settings of obsidian. 

Once you've opened the modal, it should be self explantory from there. 

### Editing Existing Comments

To edit an existing comment, navigate to the comment view, and hover over a comment. A information icon will appear. Clicking on the information icon will reopen the modal popup, allowing you to edit the comment. Here you can also delete a comment. 

## A little note why I created this

I was writing a book the other day within obsidian, and randomly thought it would be good if I could make a comment about a specific bit, so I randomly searched for plugins that existed, and saw that they either weren't implemented as I wanted, or stored the comments in the same file as the note which wouldn't work in my scenario. So as any normal person would do I just decided to make my own from scratch in a programming language that I did not know. 
