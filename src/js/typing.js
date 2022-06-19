"use strict"


/**
 * ROS node information required to decipher network structure.
 * @typedef {Object} ROSNodeInfo
 * @property {string} name - Identifier of the node.
 * @property {Array.<string>} publish - Topic names to which the node send some data.
 * @property {Array.<string>} subscribe - Topic names from which the node receives data.
 */

/**
 * ROS topic information required to decipher network structure.
 * @typedef {Object} ROSTopicInfo
 * @property {string} name - Identifier of the topic.
 * @property {Array.<string>} from - Node names which can publish data to the topic.
 * @property {Array.<string>} to - Node names which can subscribe to the topic.
 */

/**
 * Acceptable format of raw ROS network data.
 * @typedef {Object} RawNetworkData
 * @property {Array.<ROSNodeInfo>|Map.<string, ROSNodeInfo>} [nodes] - ROS node info.
 * @property {Array.<ROSTopicInfo>|Map.<string, ROSTopicInfo>} [topics] - ROS topic info.
 */
