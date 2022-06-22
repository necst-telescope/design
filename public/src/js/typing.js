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

/**
 * Formatted ROS network data.
 * @typedef {Object} FormattedNetworkData
 * @property {Map.<string, ROSNodeInfo>} nodes - ROS node info.
 * @property {Map.<string, ROSTopicInfo>} topics - ROS topic info.
 */

/**
 * Object describes single node in ROS network.
 * @typedef {Object} ROSNode
 * @property {string} name - Identifier of the node.
 * @property {number} [x] - X coordinate in figure, in %.
 * @property {number} [y] - Y coordinate in figure, in %.
 * @property {number} [order] - Relative order to the current focus in data flow.
 */

/**
 * Object describes single topic connection in ROS network.
 * @typedef {Object} ROSTopic
 * @property {string} name - Identifier of the topic.
 * @property {string} source - Node name the connection originates.
 * @property {string} target - Node name the connection heads to.
 */

/**
 * Data describes network structure.
 * @typedef {Object} NetworkData
 * @property {Map.<string, ROSNode>} nodes - Formatted node information.
 * @property {Map.<string, ROSTopic>} topics - Formatted topic information.
 */

/**
 * Information of adjacent nodes.
 * @typedef {Object} AdjacentNodeNames
 * @property {string} [thisNode] - Node information if current focus is on some node.
 * @property {Set.<string>} sameLevel - Nodes located same level as focused.
 * @property {Set.<string>} upstream - Nodes located upstream to current focus.
 * @property {Set.<string>} downstream - Nodes located downstream.
 */

/**
 * @typedef {Object} Combination
 * @property {?} source - Source of unidirectional combination.
 * @property {?} target - Target of unidirectional combination.
 */

/**
 * Some data with fields X and Y.
 * @template T
 * @typedef {Object} XYData
 * @property {T} x
 * @property {T} y
 */
