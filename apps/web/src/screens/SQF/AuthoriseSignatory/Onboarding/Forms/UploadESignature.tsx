import { Button, Group, Table } from '@mantine/core';
import { Dropzone, FileRejection, MIME_TYPES } from '@mantine/dropzone';
import {
  IconCloudUpload,
  IconPhoto,
  IconTrash,
  IconUpload,
  IconXboxX,
} from '@tabler/icons-react';
import React, { useState } from 'react';
import { color } from 'constants/color';
import { notifications } from '@mantine/notifications';
import { OnboardingHeaderCard } from 'components/SQF/BaseComponents/OnboardingHeaderCard';

interface Props {
  setNextActiveSteps: () => void;
}

interface UploadedFileData {
  file: File; //Actual file object
  preview: string; // Actual file preview URL
  name: string;
  type: string;
}

export const UploadESignature: React.FC<Props> = ({ setNextActiveSteps }) => {
  // initialFiles is an array that contains initial data when UploadedFileData first render
  const initialFile: UploadedFileData[] = [];

  // files is an array of UploadedFileData object
  // state files is initialize with the value of initialFile
  const [files, setFiles] = useState<UploadedFileData[]>(initialFile);

  // File[] object is a native JS object that contains information of individual file, part of the browser's File API
  const handleFileOnDrop = (droppedFiles: File[]) => {
    console.log('Dropped files:', droppedFiles);

    // Get list of all currently uploaded files' name
    const existingFilesName = files.map((file) => file.name);

    // Filter droppedFiles based on newly uploaded file name
    const filteredNewlyDroppedFile = droppedFiles.filter((file) => {
      if (existingFilesName.includes(file.name)) {
        // If same file name, return notifications
        notifications.show({
          title: 'Error',
          message: 'This file has already been uploaded',
          color: 'red',
          autoClose: 5000,
        });

        return false;
      }

      return true;
    });

    // droppedFiles is an array of files dropped into dropzone
    // It maps each dropped file and create an object of type UploadedFileData for each single file
    const uploadedFiles: UploadedFileData[] = filteredNewlyDroppedFile.map(
      (file) => ({
        file: file, // Assigning the actual file (a File object)
        preview: URL.createObjectURL(file), // Creates a URL for previewing the file
        name: file.name, // The file's name
        type: file.type.split('/')[1].toUpperCase(), // Extracts the file type
      })
    );

    // Updating the 'files' state
    // Create a new array that combines the contents of two arrays: currentUploadedFiles with the newly uploadedFiles
    setFiles((currentUploadedFiles) => [
      ...currentUploadedFiles,
      ...uploadedFiles,
    ]);
  };

  const handleFileOnReject = (droppedRejectedFiles: FileRejection[]) => {
    console.log('Rejected files:', droppedRejectedFiles);

    // Receives an array of FileRejection objects. Each object contains:
    //      file: The file that was rejected.
    //      errors: An array of error objects that contain details about why the file was rejected.
    droppedRejectedFiles.forEach(({ errors }) => {
      errors.forEach((error) => {
        // Show error notification why file is rejected
        // Custom the error message if file too large
        if (error.code === 'file-too-large') {
          notifications.show({
            title: 'Error',
            message: 'File is larger than 5MB',
            color: 'red',
            autoClose: 5000,
          });
        } else if (error.code === 'file-invalid-type') {
          notifications.show({
            title: 'Error',
            message: 'Only PNG and JPEG image formats are supported',
            color: 'red',
            autoClose: 5000,
          });
        }
      });
    });
  };

  const onClickFilePreview = (filePreviewUrl: string): void => {
    window.open(filePreviewUrl, '_blank');
  };

  const handleDelete = (fileName: string) => {
    // Creating a new array that contains all the 'files' except the one whose name matches fileName, return new array
    setFiles((prevFiles) =>
      prevFiles.filter((files) => files.name !== fileName)
    );
  };

  const handleUploadFileToBackend = async (files: UploadedFileData[]) => {
    if (files.length === 0) {
      console.log('No files to upload');

      return;
    }

    // Prepare data to be sent over HTTP request
    const formData = new FormData();

    files.forEach((fileData) => {
      // 'file' is the key
      // fileData.file: This is the actual file object
      // fileData.name: This is the custom name given to the file
      formData.append('file', fileData.file, fileData.name);
    });

    // Example of console log:
    //      file: File {name: "image1.png", size: 102400, type: "image/png"}
    for (const [key, value] of formData) {
      console.log(`${key}:`, value);
    }

    try {
      // TODO: Store values to backend
      //   const response = await axios.post('http://localhost:5000/upload', formData, {
      //     headers: {
      //       'Content-Type': 'multipart/form-data',
      //     },
      //   });

      // Redirected to next step
      setNextActiveSteps();

      notifications.show({
        title: 'Success',
        message: 'Your file has been uploaded successfully!',
        color: 'green',
        autoClose: 5000,
      });
    } catch (error) {
      console.error('Failed upload file error:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to upload the file',
        color: 'red',
        autoClose: 5000,
      });

      throw error;
    }
  };

  // Rows for table
  const rows = files.map((files) => (
    <Table.Tr key={files.name}>
      <Table.Td>
        <Button
          color="black"
          variant="transparent"
          onClick={() => onClickFilePreview(files.preview)}
        >
          <IconPhoto size={16} />
        </Button>
      </Table.Td>
      <Table.Td>{files.name}</Table.Td>
      <Table.Td>{files.type}</Table.Td>
      <Table.Td>
        <Button
          color="red"
          variant="transparent"
          onClick={() => handleDelete(files.name)}
        >
          <IconTrash size={16} />
        </Button>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <div className="flex flex-col justify-center items-center mt-7 mx-10">
      <OnboardingHeaderCard
        title="Upload e-Signature"
        description="Upload your signature image for future use."
        Icon={IconCloudUpload}
      ></OnboardingHeaderCard>

      {/* Dropzone */}
      <div className=" w-full mt-5 rounded-lg">
        <Dropzone
          onDrop={(droppedFiles) => handleFileOnDrop(droppedFiles)}
          onReject={(droppedRejectedFiles) =>
            handleFileOnReject(droppedRejectedFiles)
          }
          maxSize={5 * 1024 ** 2} // Max file size: 5MB
          accept={[MIME_TYPES.png, MIME_TYPES.jpeg]} // Accepted format: png, jpeg
        >
          <Group
            justify="center"
            mih={180} // minimum height
            p={30}
          >
            <Dropzone.Accept>
              <IconUpload className="h-7 w-7" stroke={1.5} />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconXboxX
                className="h-7 w-7"
                style={{ color: 'var(--mantine-color-red-6)' }}
                stroke={1.5}
              />
            </Dropzone.Reject>

            <div className="flex flex-col text-center w-full text-sm">
              <p>
                Please upload your signature image. Drag and drop files here, or
                click to select file.
              </p>
              <p className="pt-2">
                Maximum file size: 5MB. Supported formats: .jpeg, .png.
              </p>
              <div>
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full md:w-auto "
                  style={{
                    color: '#ffffff',
                    backgroundColor: color.DARKBLUE,
                    marginTop: '30px',
                  }}
                >
                  Select files
                </Button>
              </div>
            </div>
          </Group>
        </Dropzone>
      </div>

      {/* Table uploaded file list  */}
      <div className="w-full my-7">
        <p className="text-sm mb-3 font-bold">Uploaded files</p>
        {files.length === 0 ? (
          <p className="text-sm">No files uploaded yet</p>
        ) : (
          <Table verticalSpacing="xs" withTableBorder className="rounded-lg">
            <Table.Thead className="text-sm">
              <Table.Tr>
                <Table.Th>File preview</Table.Th>
                <Table.Th>File name</Table.Th>
                <Table.Th>File type</Table.Th>
                <Table.Th>Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody className="text-xs ">{rows}</Table.Tbody>
          </Table>
        )}
      </div>

      {files.length >= 1 && (
        <div className="flex self-end">
          <Button
            type="submit"
            variant="primary"
            className="w-full md:w-auto"
            style={{
              color: '#ffffff',
              backgroundColor: color.DARKBLUE,
              marginTop: '30px',
            }}
            onClick={() => handleUploadFileToBackend(files)}
          >
            Save & continue
          </Button>
        </div>
      )}
    </div>
  );
};
