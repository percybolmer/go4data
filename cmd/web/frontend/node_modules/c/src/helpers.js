//!Defines two helper functions.

/*
 * c
 * https://github.com/rumpl/c
 *
 * Copyright (c) 2012 Djordje Lukic
 * Licensed under the MIT license.
 */

"use strict";
const helpers = module.exports;
const colors = require("colors/safe"); //Despite looking unused, is not unused.
const fs = require("fs");

const SPACING = 1; //Change this value if you want more or less space between file names and comments.
const PADDING = " "; //Change this value for what character should present your padding.

/**Prints a coloured node name, padding, and it's assigned comment.
 * @param {String} nodeName The name of the node.
 * @param {String} nodeComment The comment for the node.
 * @param {int} maxLine The length of the longest node name in the specified directory.
 * @param {String} dir the relative filepath to a directory, the contents of which will be listed.
 */
var print = function (nodeName, nodeComment, maxLine, dir) {
  nodeComment = nodeComment || "";
  nodeComment = nodeComment.replace(/(\r\n|\n|\r)/gm, " "); //Removes any new lines with blank spaces.
  let pad;

  //The amount of spacing & the colouring changes depending on whether 'file' is a file or a directory.
  if (fs.statSync(dir + "/" + nodeName).isFile()) {
    pad = PADDING.repeat(maxLine - nodeName.length + 1 + SPACING);
    console.log(
      colors.brightGreen(nodeName) + pad + colors.yellow(nodeComment)
    );
  } else {
    pad = PADDING.repeat(maxLine - nodeName.length + SPACING);
    console.log(
      colors.brightCyan(nodeName + "/") + pad + colors.yellow(nodeComment)
    );
  }
};

/**Prints all of the files and sub-directories of a specified directory, as well as their assigned comments.
 * @param {String} files An array of all of the file names in the specified directory.
 * @param {String} comments An array of all of the comments in the specified directory.
 * @param {String} dir the relative filepath to a directory, the content of which will be listed.
 */
helpers.printFileComments = function (files, comments, dir) {
  //Gets the length of the longest filename in the array - iterators through files.
  const maxLine = maxLength(files);

  //Prints the current file and it's comment
  print(".", comments["."], maxLine, dir);
  print("..", comments[".."], maxLine, dir);

  //For each file run the print function.
  files.forEach(function (file) {
    print(file, comments[file], maxLine, dir);
  });
};

/**Prints only the files and sub-directories of a specified directory which have comments, as well as their assigned comments.
 * @param {String} files An array of all of the file names in the specified directory.
 * @param {String} comments An array of all of the comments in the specified directory.
 */
helpers.printOnlyComments = function (files, comments) {
  //Gets the length of the longest filename in the array - iterators through files.
  const maxLine = maxLength(files);

  //Prints the current file and it's comment
  if (comments["."]) print(".", comments["."], maxLine);
  if (comments[".."]) print("..", comments[".."], maxLine);

  //For each file with a comment, run the print function.
  files.forEach(function (file) {
    if (comments[file]) print(file, comments[file], maxLine);
  });
};

/**  Calculates the longest file name from all the returned files.
 * @param {String} files an array of all the file names in the specified directory.
 */
function maxLength(files) {
  return files.reduce((a, b) => {
    return b.length > a ? b.length : a;
  }, 0);
}
